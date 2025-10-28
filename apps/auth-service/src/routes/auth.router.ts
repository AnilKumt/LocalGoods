import express,{Router} from "express";
import { addUserAddress, createShop, createStripeConnectionLink, deleteUserAddress, getAdmin, getLayoutData, getSeller, getUser, getUserAddresses, loginAdmin, loginSeller, loginUser, logoutUser, refreshToken, registerSeller, resetUserPassword, updateUserPassword, userForgotPassword, userRegistration, verifySeller, verifyUser, verifyUserForgotPassword } from "../controller/auth.controller";
import isAuthenticated from "../../../../packages/middleware/isAuthenticated"
import { isAdmin, isSeller } from "../../../../packages/middleware/authorizeRoles";

const router:Router = express.Router();

router.post("/user-registration",userRegistration);
router.post("/verify-user",verifyUser);
router.post("/login-user",loginUser);
router.get("/logout-user",logoutUser);
router.post("/refresh-token",refreshToken);
router.get("/logged-in-user",isAuthenticated,getUser);
router.post("/forgot-password-user",userForgotPassword);
router.post("/reset-password-user",resetUserPassword);
router.post("/verify-forgot-password-user",verifyUserForgotPassword);
router.post("/change-password",isAuthenticated,updateUserPassword);

router.post("/seller-registration",registerSeller);
router.post("/verify-seller",verifySeller);
router.post("/create-shop",createShop);
router.post("/create-stripe-link",createStripeConnectionLink);
router.post("/login-seller",loginSeller);
router.get("/logged-in-seller",isAuthenticated,isSeller,getSeller);
router.post("/login-admin",loginAdmin);
router.get("/logged-in-admin",isAuthenticated,isAdmin,getAdmin);


router.get("/shipping-addresses",isAuthenticated,getUserAddresses);
router.post("/add-address",isAuthenticated,addUserAddress);
router.delete("/delete-address/:addressId",isAuthenticated,deleteUserAddress);
router.get("/get-layouts",getLayoutData);


export default router;