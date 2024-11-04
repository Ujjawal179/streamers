import { Request, Response } from 'express';
import { YoutuberService } from '../services/youtuberService';
import { PaymentService } from '../services/paymentService';
import bcrypt from 'bcrypt';

export class YoutuberController {
    static async getYoutuber(req: Request, res: Response) {
        const { youtuberId } = req.params;

        try {
            const youtuber = await YoutuberService.getYoutuberById(youtuberId);

            if (!youtuber) {
                return res.status(404).json({ message: 'YouTuber not found' });
            }

            res.json(youtuber);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching YouTuber details' });
        }
    }

    static async updateYoutuber(req: Request, res: Response) {
        const { youtuberId } = req.params;
        const { name, password, channelLink, email, ifsc, accountNumber, timeout, charge, phoneNumber } = req.body;

        try {
            const updateData: any = {};
            if (name) updateData.name = name;
            if (channelLink) updateData.channelLink = channelLink;
            if (ifsc) updateData.ifsc = ifsc;
            if (accountNumber) updateData.accountNumber = accountNumber;
            if (timeout && timeout >= 10) updateData.timeout = timeout;
            if (charge && charge >= 10) updateData.charge = charge;
            if (phoneNumber) updateData.phoneNumber = phoneNumber;

            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            const updatedYoutuber = await YoutuberService.updateYoutuber(youtuberId, updateData);

            res.json({ message: "Updated successfully", youtuber: updatedYoutuber });
        } catch (error) {
            res.status(500).json({ message: "Error updating YouTuber" });
        }
    }

    static async getPayments(req: Request, res: Response) {
        const { youtuberId } = req.params;

        try {
            const payments = await PaymentService.getPaymentsByYoutuber(youtuberId);
            res.json(payments);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching payments' });
        }
    }

    static async updatePayoutDetails(req: Request, res: Response) {
        const { youtuberId } = req.params;
        const { ifsc, accountNumber } = req.body;

        try {
            const updatedYoutuber = await YoutuberService.updatePayoutDetails(youtuberId, ifsc, accountNumber);

            res.json({ message: "Payout details updated", youtuber: updatedYoutuber });
        } catch (error) {
            res.status(500).json({ message: "Error updating payout details" });
        }
    }
}
