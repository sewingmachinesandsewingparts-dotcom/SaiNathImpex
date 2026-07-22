import User from "@/src/models/User";

export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image || "",
    role: user.role,
    status: user.status,
    permissions: user.permissions || [],
  };
}

export async function createUser({ name, email, password = "", image = "" }) {
  const count = await User.countDocuments();
  const userId = `USR${String(count + 1).padStart(3, "0")}`;

  return new User({
    id: userId,
    name,
    email,
    password,
    image,
    status: "active",
    role: "user",
    permissions: [],
  }).save();
}
