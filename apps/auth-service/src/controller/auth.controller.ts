import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { sendOtp, validateRegistrationData } from "../utils/auth.helper";
import prisma from "../../../../packages/libs/prisma/index";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "../../../../packages/error-handler/index";
import {
  checkOtpRestrictions,
  trackOtpRequests,
  verifyOtp,
  handleForgotPassword,
  verifyForgotPasswordOtp,
} from "../utils/auth.helper";
import { setCookie } from "../utils/cookies/setCookies";
import Stripe from "stripe";
import {sendLog} from "../../../../packages/utils/logs/send-logs"


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion:"2025-09-30.clover"
});

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user");
    const { name, email } = req.body;
    console.log("reached");
    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError(`User already exists with this mail`));
    }

    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "user-activation-mail");
    res.status(200).json({
      message: "OTP send to email.please verify your account.",
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError("All fields are required."));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError("User already exists."));
    }
    await verifyOtp(email, otp, next);

    
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(201).json({
      success: true,
      message: "User registered succesfully!",
    });
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new AuthenticationError("User doesn' exists!"));
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return next(new AuthenticationError("Invalid email or password."));
    }

    res.clearCookie("seller_access_token");
    res.clearCookie("seller_refresh_token");
    const accessToken = jwt.sign(
      { id: user.id, role: "user",name: user.name, 
    email: user.email, },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );
    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);
    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken =
      req.cookies["refresh_token"] ||
      req.cookies["seller-refresh-token"] ||
      req.cookies["admin-refresh-token"] ||
      req.headers.authorization?.split(" ")[1];
    if (!refreshToken) {
      throw new ValidationError("Unauthrorized! No refresh token.");
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string; role: string };

   

    if (!decoded || !decoded.id || !decoded.role) {
      return new JsonWebTokenError("Forbidden! invalid refresh token.");
    }

    let account;
    if (decoded.role === "user"|| decoded.role==="admin") {
      account = await prisma.users.findUnique({
        where: { id: decoded.id },
      });
      req.user = account;
    }else if(decoded.role === "seller"){
      account = await prisma.sellers.findUnique({
        where: { id: decoded.id },
        include:{Shop:true}
      });
      req.seller = account;
    }

    if (!account) {
      return res.status(401).json({ message: "Account not found!" });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    if(decoded.role==="user")
      setCookie(res, "access_token", newAccessToken);
    else if(decoded.role === "seller")
      setCookie(res, "seller-access-token", newAccessToken);

    req.role = decoded.role;
    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

export const getUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    await sendLog({
      type:"success",
      message:`USer data retrieved ${user?.email}`,
      source:"auth-service"
    })
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    console.log(user);
    res.status(201).json({
      success: true,
      user,
    });

  } catch (error) {
    next(error);
  }
};


export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, "user");
};

export const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyForgotPasswordOtp(req, res, next);
};

export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body as Record<string, any>;
    const { email, newPassword } = body;
    if (!email || !newPassword) {
      return next(new ValidationError("Email and new password are required!"));
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new ValidationError("User not found!"));
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password as string
    );
    if (isSamePassword) {
      return next(
        new ValidationError("New password cannot be same as old password.")
      );
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword },
    });
    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    next(error);
  }
};

export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "seller");
    const { name, email } = req.body;

    const exisitingSeller = await prisma.sellers.findUnique({
      where: { email },
    });

    if (exisitingSeller) {
      throw new ValidationError("Seller already exists with this email.");
    }

    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "seller-activation");

    res
      .status(200)
      .json({ message: "OTP sent to email.Please verify your account." });
  } catch (error) {
    next(error);
  }
};

export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name, phone_number, country } = req.body;

    if (!email || !otp || !password || !name || !phone_number || !country) {
      return next(new ValidationError("All fields are required!"));
    }

    const exisitingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (exisitingSeller) {
      return next(new ValidationError("Seller already exists with this email"));
    }
    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await prisma.sellers.create({
      data: {
        name,
        email,
        password: hashedPassword,
        country,
        phone_number,
      },
    });

    res.status(201).json({ seller, message: "Seller registered succesfully!" });
  } catch (error) {
    next(error);
  }
};

export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, bio, address, opening_hours, website, category, sellerId } =
      req.body;

    console.log(req.body);

    if (!name || !bio || !address || !sellerId || !opening_hours || !category) {
      return next(new ValidationError("All fields are required"));
    }

    const shopData: any = {
      name,
      bio,
      address,
      opening_hours,
      category,
      sellerId,
    };

    if (website && website.trim() !== "") {
      shopData.website = website;
    }

    const shop = await prisma.shops.create({
      data: shopData,
    });

    res.status(201).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

export const createStripeConnectionLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) return new ValidationError("Seller Id is required.");

    const seller = await prisma.sellers.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return next(new ValidationError("Seller is not available with this id."));
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: seller?.email,
      country: "US",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.sellers.update({
      where: { id: sellerId },
      data: { stripeId: account.id },
    });

    const accountLink = await stripe.accountLinks.create({
      account:account.id,
      refresh_url:`http://localhost:3001/signup`,
      return_url:`http://localhost:3001/success`,
      type:"account_onboarding"
    })

    res.json({url:accountLink.url})

    // const fakeStripeId = `acct_${Math.random().toString(36).substring(2, 15)}`;

    // await prisma.sellers.update({
    //   where: { id: sellerId },
    //   data: { stripeId: fakeStripeId },
    // });

    //  const fakeAccountLink = {
    //   url: `http://localhost:3000/dummy-stripe-onboarding?sellerId=${sellerId}&accountId=${fakeStripeId}`,
    // };

    // res.json({ url: fakeAccountLink.url });

    
  } catch (error) {
    return next(error);
  }
};

export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }
    const seller = await prisma.sellers.findUnique({ where: { email } });
    if (!seller) return next(new AuthenticationError("User doesn' exists!"));
    const isMatch = await bcrypt.compare(password, seller.password!);
    if (!isMatch) {
      return next(new AuthenticationError("Invalid email or password."));
    }

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    const accessToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );
    const refreshToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );
    setCookie(res, "seller-refresh-token", refreshToken);
    setCookie(res, "seller-access-token", accessToken);
    res.status(200).json({
      message: "Login successful",
      seller: { id: seller.id, email: seller.email, name: seller.name },
    });
  } catch (error) {
    next(error);
  }
};

export const getSeller = async (req: any, res: Response, next: NextFunction) => {
  try {
    const seller = req.seller;
    res.status(201).json({
      success: true,
      seller,
    });
  } catch (error) {
    next(error);
  }
};

export const addUserAddress = async(
  req:any,
  res:Response,
  next:NextFunction
)=>{
  try {
    const userId = req.user?.id;
    const {label,name,street,city,zip,country,isDefault} = req.body;

    if(!label || !name || !street || !city || !zip || !country){
      return next(new ValidationError("All fields are required"));
    }

    if(isDefault){
      await prisma.address.updateMany({
        where:{
          userId,
          isDefault:true
        },
        data:{
          isDefault:false,
        },
      });
    }

    const newAddress = await prisma.address.create({
      data:{
        userId,
        label,
        name,
        street,
        city,
        zip,
        country,
        isDefault,
      }
    });

    res.status(201).json({
      success:true,
      address:newAddress,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUserAddress = async (
  req:any,
  res:Response,
  next:NextFunction
)=>{
  try {
    const userId= req.user?.id;
    const {addressId} = req.params;

    if(!addressId){
      return next(new ValidationError("address ID is required"));
    }

    const existingAddress = await prisma.address.findFirst({
      where:{
        id:addressId,
        userId,
      },
    });

    if(!existingAddress){
      return next(new NotFoundError("Address not Found or Unauthorized."));
    }

    await prisma.address.delete({
      where:{
        id:addressId,
      },
    });

    res.status(200).json({
      success:true,
      message:"Address deleted successfully."
    });

  } catch (error) {
    return next(error);
  }
};


export const getUserAddresses = async(
  req:any,
  res:Response,
  next:NextFunction
)=>{
  try {
    const userId = req.user?.id;
    const addresses = await prisma.address.findMany({
      where:{
        userId,
      },
      orderBy:{
        createdAt:"desc"
      },
    });

    res.status(200).json({
      success:true,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserPassword = async(
  req:any,
  res:Response,
  next:NextFunction
)=> {
  try {
    const userId = req.user?.id;
    const {currentPassword,newPassword,confirmPassword} = req.body;

    if(!currentPassword || !newPassword || !confirmPassword){
      return next(new ValidationError("All fields are required"));
    }

    if(newPassword !== confirmPassword){
      return next(new ValidationError("new passowrd do not match."));
    }
    if(confirmPassword===newPassword){
      return next(
        new ValidationError("New password cannot be the same as the current password")
      );
    }

    const user = await prisma.users.findUnique({
      where:{id:userId}
    });

    if(!user || !user.password){
      return next(new AuthenticationError("user not found or passowrd not set"));
    }
    
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if(!isPasswordCorrect){
      return next(new AuthenticationError("current password is incorrect"));
    }

    const hashedPassword = await bcrypt.hash(newPassword,12);

    await prisma.users.update({
      where:{id:userId},
      data:{password:hashedPassword},
    });

    res.status(200).json({message:"Password updated successfully"});
  } catch (error) {
    next(error);
  }
};

export const loginAdmin = async (
  req:Request,
  res:Response,
  next:NextFunction
)=>{
  try {
    const {email,password} = req.body;

    if(!email || !password){
      return next(new ValidationError("Email and password are required!"));
    }

    const user = await prisma.users.findUnique({where:{email}});

    console.log(user)

    if(!user) return next(new AuthenticationError("User doesn't exist!"));


    // const isMatch = await bcrypt.compare(password.trim(),user.password!);
    const isMatch = password === user.password;
    console.log(isMatch)
    if(!isMatch){
      return next(new AuthenticationError("Invalid email or password"));
    }

    //const isAdmin = user.role === "admin";

    // if(!isAdmin){
    //   sendLog({
    //     type:"error",
    //     message:`Admin login failed for ${email} - not an admin`,
    //     source:"auth-service"
    //   });
    //   return next(new AuthenticationError("Invalid access!"));
    // }

    // sendLog({
    //     type:"success",
    //     message:`Admin login successful ${email}`,
    //     source:"auth-service"
    //   });

    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    const accessToken = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        
        expiresIn: "15m",
      }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    setCookie(res,"admin-refresh-token",refreshToken);
    setCookie(res,"admin-access-token",accessToken);

    res.status(200).json({
      message:"Login successful!",
      user:{id:user.id,email:user.email,name:user.name},
    });

  } catch (error) {
    return next(error);
  }
}

export const getLayoutData = async (
  req:Request,
  res:Response,
  next:NextFunction
)=>{
  try {
    const layout = await prisma.site_config.findFirst();

    res.status(200).json({
      success:true,
      layout,
    });

  } catch (error) {
    next(error);    
  }
}

export const logoutUser = async (
  req:Request,
  res:Response,
  next:NextFunction
)=>{
  try {
    // Clear all cookies
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("seller_access_token");
    res.clearCookie("seller_refresh_token");
    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");
    res.clearCookie("admin-access-token");
    res.clearCookie("admin-refresh-token");

    res.status(200).json({
      success:true,
      message:"Logged out successfully",
    });
  } catch (error) {
    next(error);    
  }
}