import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { GpsService } from '../gps/gps.service';
import { UserRole } from '../../common/enums/user-role.enum';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly gps: GpsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers.authorization?.replace('Bearer ', '') as string | undefined);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.user = payload;
      await client.join(`user:${payload.id}`);
      await client.join(`role:${payload.role}`);
      this.logger.log(`Socket connected ${payload.email}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as { email?: string } | undefined;
    if (user?.email) {
      this.logger.log(`Socket disconnected ${user.email}`);
    }
  }

  @SubscribeMessage('gps:ping')
  async onGpsPing(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { latitude: number; longitude: number; bookingId?: string },
  ) {
    const user = client.data.user as { id: string; role: UserRole };
    const ping = await this.gps.ping(user.id, user.role, body);
    if (body.bookingId) {
      this.server.to(`booking:${body.bookingId}`).emit('gps:updated', {
        userId: user.id,
        ...body,
      });
    }
    return ping;
  }

  @SubscribeMessage('booking:subscribe')
  async subscribeBooking(@ConnectedSocket() client: Socket, @MessageBody() body: { bookingId: string }) {
    await client.join(`booking:${body.bookingId}`);
    return { joined: body.bookingId };
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToRole(role: string, event: string, payload: unknown) {
    this.server?.to(`role:${role}`).emit(event, payload);
  }
}
