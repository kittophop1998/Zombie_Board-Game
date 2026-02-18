import { Server } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { setupSocketServer } from '../../lib/socket';

let io: ReturnType<typeof setupSocketServer> | undefined;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket as unknown as {
    server: Server & {
      io?: ReturnType<typeof setupSocketServer>;
    };
  };

  if (!socket.server.io) {
    console.log('Setting up Socket.io server...');
    const httpServer: Server = socket.server;
    io = setupSocketServer(httpServer);
    socket.server.io = io;
  }
  
  res.end();
}

export const config = {
  api: {
    bodyParser: false
  }
};
