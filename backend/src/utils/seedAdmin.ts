import Admin, { AdminRole } from "../models/Admin.js";

export const seedAdmin = async (): Promise<void> => {
    try {
        const email = process.env.ADMIN_EMAIL!;
        const password = process.env.ADMIN_PASSWORD!;
        const name = process.env.ADMIN_NAME || "Super Admin";

        const exists = await Admin.findOne({ email });
        if (exists) {
            console.log(`Admin already exists: ${email}`);
            return;
        }

        await Admin.create({
            name,
            email,
            password,
            role: AdminRole.ADMIN,
            isActive: true,
        });

        console.log(`Default admin created: ${email}`);
    } catch (error) {
        console.error("Failed to seed admin:", error);
        throw error;
    }
};