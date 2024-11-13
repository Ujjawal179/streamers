import { Request, Response } from 'express';
import prisma from '../db/db';

export const updateYoutuber = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const youtuber = await prisma.youtuber.update({
      where: { id },
      data: req.body
    });
    res.json(youtuber);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update youtuber' });
  }
};

export const getUsername = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const youtuber = await prisma.youtuber.findUnique({
      where: { id },
      select: { name: true, charge: true, isLive: true, timeout: true }
    });
    if (!youtuber) return res.status(404).json({ error: 'Youtuber not found' });
    res.json({ username: youtuber.name, charge: youtuber.charge, isLive: youtuber.isLive, timeout: youtuber.timeout });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch username' });
  }
};

export const getYoutuberDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const youtuber = await prisma.youtuber.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        channelLink: true,
        phoneNumber: true,
        timeout: true,
        charge: true,
        isLive: true,
        alertBoxUrl: true
      }
    });
    if (!youtuber) return res.status(404).json({ error: 'Youtuber not found' });
    res.json(youtuber);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch youtuber details' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { timeout, charge } = req.body;
    const youtuber = await prisma.youtuber.update({
      where: { id },
      data: { timeout, charge }
    });
    res.json(youtuber);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const getYoutuberCampaigns = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaigns = await prisma.campaign.findMany({
      where: {
        youtubers: {
          some: { id }
        }
      }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};
