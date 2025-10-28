import { AuthenticationError, NotFoundError, ValidationError } from "../../../../packages/error-handler/index";
import { Response, NextFunction, Request } from "express";
import prisma from "../../../../packages/libs/prisma/index";
import redis from "../../../../packages/libs/redis";
import { clearUnseenCount, getUnseenCount } from "../../../../packages/libs/redis/message.redis";
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const newConversation = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.body;
    const userId = req.user.id;

    if (!sellerId) {
      return next(new ValidationError("Seller Id is required!"));
    }

    if (!objectIdRegex.test(sellerId)) {
      return next(new ValidationError("A valid Seller Id is required!"));
    }

    if (!objectIdRegex.test(userId)) {
      return next(new ValidationError("A valid user Id is required!"));
    }

    const existingGroup = await prisma.conversationGroup.findFirst({
      where: {
        isGroup: false,
        participantsIds: {
          hasEvery: [userId, sellerId],
        },
      },
    });

    if (existingGroup) {
      return res.status(200).json({ converstion: existingGroup, isNew: false });
    }

    const newGroup = await prisma.conversationGroup.create({
      data: {
        isGroup: false,
        creatorId: userId,
        participantsIds: [userId, sellerId],
      },
    });

    // --- DEBUGGING CHANGE ---
    // Replace the single createMany with two separate create calls.
    console.log("Creating participant for user...");
    await prisma.participant.create({
      data: {
        conversationId: newGroup.id,
        userId: userId,
      },
    });

    console.log("Creating participant for seller...");
    await prisma.participant.create({
      data: {
        conversationId: newGroup.id,
        sellerId: sellerId,
      },
    });

    return res.status(201).json({ conversation: newGroup, isNew: true });
  } catch (error) {
    next(error);
  }
};

export const getUserConversations = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversationGroup.findMany({
      where: {
        participantsIds: {
          has: userId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const responseData = await Promise.all(
      conversations.map(async (group) => {
        const sellerParticipant = await prisma.participant.findFirst({
          where: {
            conversationId: group.id,
            sellerId: { not: null },
          },
        });

        let seller = null;
        if (sellerParticipant?.sellerId) {
          seller = await prisma.sellers.findUnique({
            where: {
              id: sellerParticipant.sellerId,
            },
            include: {
              Shop: true,
            },
          });
        }
        const lastMessage = await prisma.message.findFirst({
          where: {
            conversationId: group.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        let isOnline = false;
        if (sellerParticipant?.sellerId) {
          const redisKey = `online:seller:${sellerParticipant.sellerId}`;
          const redisResult = await redis.get(redisKey);
          isOnline = !!redisResult;
        }

        const unreadCount = await getUnseenCount("user", group.id);

        return {
          conversationId: group.id,
          seller: {
            id: seller?.id || null,
            name: seller?.Shop?.name || "Unknown",
            isOnline,
            avatar: seller?.Shop?.avatarId,
          },
          lastMessage:
            lastMessage?.content || "say something to start a conversation",
          lastMessageAt: lastMessage?.createdAt || group.updatedAt,
          unreadCount,
        };
      })
    );

    return res.status(200).json({ conversations: responseData });
  } catch (error) {
    next(error);
  }
};

export const getSellerConversations = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.seller.id;

    const conversations = await prisma.conversationGroup.findMany({
      where: {
        participantsIds: {
          has: sellerId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const responseData = await Promise.all(
      conversations.map(async (group) => {
        const userParticipant = await prisma.participant.findFirst({
          where: {
            conversationId: group.id,
            userId: { not: null },
          },
        });

        let user = null;
        if (userParticipant?.userId) {
          user = await prisma.users.findUnique({
            where: {
              id: userParticipant.userId,
            },
            include: {
              avatar: true,
            },
          });
        }
        const lastMessage = await prisma.message.findFirst({
          where: {
            conversationId: group.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        let isOnline = false;
        if (userParticipant?.userId) {
          const redisKey = `online:user:user_${userParticipant.userId}`;
          const redisResult = await redis.get(redisKey);
          isOnline = !!redisResult;
        }

        const unreadCount = await getUnseenCount("seller", group.id);

        return {
          conversationId: group.id,
          user: {
            id: user?.id || null,
            name: user?.name || "Unknown",
            isOnline,
            avatar: user?.avatar||null,
          },
          lastMessage:
            lastMessage?.content || "say something to start a conversation",
          lastMessageAt: lastMessage?.createdAt || group.updatedAt,
          unreadCount,
        };
      })
    );

    return res.status(200).json({ conversations: responseData });
  } catch (error) {
    next(error);
  }
};

export const fetchMessages = async(
    req:any,
    res:Response,
    next:NextFunction
)=>{
    try {
        const userId = req.user.id;
        const {conversationId} = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = 10;

        if(!conversationId){
            return next(new ValidationError("conversation Id is required"));
        }
        const conversation = await prisma.conversationGroup.findUnique({
            where:{id:conversationId}
        })

        if(!conversation){
            return next(new NotFoundError("Conversation not found"));
        }

        const hasAccess = conversation.participantsIds.includes(userId);

        if(!hasAccess){
            return next(new AuthenticationError("access denied to this conversation"));
        }

        await clearUnseenCount("user",conversationId);

        const sellerParticipant = await prisma.participant.findFirst({
            where:{
                conversationId,
                sellerId:{not:null},
            },
        });

        let seller = null;
        let isOnline = false;

        if(sellerParticipant?.sellerId){
            seller = await prisma.sellers.findUnique({
                where:{id:sellerParticipant.sellerId},
                include:{
                    Shop:true,
                }
            })

            const redisKey = `online:seller:${sellerParticipant.sellerId}`;
            const redisResult = await redis.get(redisKey);
            isOnline = !!redisResult;

            const messages = await prisma.message.findMany({
                where:{conversationId},
                orderBy:{createdAt:"desc"},
                skip:(page-1)*pageSize,
                take:pageSize,
            })

            return res.status(200).json({
                messages,
                seller:{
                    id:seller?.id || null,
                    name:seller?.Shop?.name || "Unkown",
                    avatar:seller?.Shop?.avatarId || null,
                    isOnline,
                },
                currentPage:page,
                hasMore:messages.length===pageSize,
            });
        }
    } catch (error) {
        return next(error);
    }
}

export const fetchSellerMessages = async(
    req:any,
    res:Response,
    next:NextFunction
)=>{
    try {
        const sellerId = req.seller.id;
        const {conversationId} = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = 10;

        if(!conversationId){
            return next(new ValidationError("conversation Id is required"));
        }
        const conversation = await prisma.conversationGroup.findUnique({
            where:{id:conversationId}
        })

        if(!conversation){
            return next(new NotFoundError("Conversation not found"));
        }

        const hasAccess = conversation.participantsIds.includes(sellerId);

        if(!hasAccess){
            return next(new AuthenticationError("access denied to this conversation"));
        }

        await clearUnseenCount("seller",conversationId);

        const userParticipant = await prisma.participant.findFirst({
            where:{
                conversationId,
                userId:{not:null},  // ✅ Fixed: Should be userId, not sellerId
            },
        });

        let user = null;
        let isOnline = false;

        if(userParticipant?.userId){
            user = await prisma.users.findUnique({
                where:{id:userParticipant.userId},
                include:{
                    avatar:true,
                }
            })

            const redisKey = `online:user:user_${userParticipant.userId}`;
            const redisResult = await redis.get(redisKey);
            isOnline = !!redisResult;
        }

        const messages = await prisma.message.findMany({
            where:{conversationId},
            orderBy:{createdAt:"desc"},
            skip:(page-1)*pageSize,
            take:pageSize,
        })

        return res.status(200).json({
            messages,
            user:{  // ✅ Fixed: Should be user, not seller
                id:user?.id || null,
                name:user?.name || "Unknown",
                avatar:user?.avatar || null,
                isOnline,
            },
            currentPage:page,
            hasMore:messages.length===pageSize,
        });
    } catch (error) {
        return next(error);
    }
}
