import { prisma } from "@repo/db";

export const createDbNotification = (userId: string, message: string) => {
  return prisma.notification.create({
    data: {
      userId,
      message,
    },
  });
};

export const getNotificationsByUserId = (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const markAsReadById = (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
    },
  });
};

export const markAllReadByUserId = (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
    },
  });
};
