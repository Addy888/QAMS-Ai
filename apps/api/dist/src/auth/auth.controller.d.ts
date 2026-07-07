import { AuthService } from "./auth.service";
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        username: string;
        password: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            username: string;
            passwordHash: string;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
        };
    }>;
}
