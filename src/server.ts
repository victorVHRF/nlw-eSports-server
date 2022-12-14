import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minute';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
  log: ['query']
})

app.get('/games', async (req, res) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        }
      }
    }
  })

  return res.json(games);
});

app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const body = request.body;


  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discordId: body.discordId,
      weekDays: body.weekDays.join(','),
      hourStarted: convertHourStringToMinutes(body.hourStarted),
      hourEnded: convertHourStringToMinutes(body.hourEnded),
      useVoiceChannel: body.useVoiceChannel,

    }
  })

  return response.status(201).json(ad);
});

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStarted: true,
      hourEnded: true
    },
    where: {
      gameId,
    },
    orderBy: {
      createAt: 'desc'
    }
  })
  return response.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStarted: convertMinutesToHourString(ad.hourStarted),
      hourEnded: convertMinutesToHourString(ad.hourEnded),
    }
  }))
})

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discordId: true,
    },
    where: {
      id: adId,
    }
  })

  return response.json({
    discordId: ad.discordId,
  })
})

app.listen(3333)