import {Request, Response} from 'express'
import status from 'http-status'
import { sendError, sendSuccess } from '@/utils/response.util'
import {emailSendings} from '@/types/admin.types'
import { sendEmail } from '@/utils/brevo.util'



export const sendMails = async (req: Request, res: Response) => {
    try {
        const {data, error} = emailSendings.safeParse(req.body)
        if(error) {
            const errors: Record<string, string[]> = {};
            error.issues.forEach((err) => {
                const path = err.path.join(".");
                if (!errors[path]) {
                errors[path] = [];
                }
                errors[path].push(err.message);
            });
            return sendError(
                res,
                "Validation failed",
                status.BAD_REQUEST,
                undefined,
                errors
            );
        }
        await sendEmail({
          to: data?.userEmail!,
          subject: data?.subject!,
          htmlContent: `<div>${data.emailText}</div>`
        })
        return sendSuccess(res, "Email send", status.OK)
        return 
    } catch (error) {
        return sendError(res, "Internal Server Error", status.INTERNAL_SERVER_ERROR) 
    }
}