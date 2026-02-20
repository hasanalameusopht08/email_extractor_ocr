import * as userService from '../services/user.service.js';

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};