export const mockUser = {
  id: "test-user-id",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockCredentials = {
  email: "test@example.com",
  password: "password123",
  name: "Test User",
};

export const mockSession = {
  id: "test-session-id",
  userId: mockUser.id,
  token: "test-session-token",
  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  ipAddress: null,
  userAgent: null,
};
