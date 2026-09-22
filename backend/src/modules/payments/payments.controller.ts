import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(@InjectRepository(Payment) private readonly payments: Repository<Payment>) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  list() {
    return this.payments.find({ order: { createdAt: 'DESC' }, take: 50 });
  }

  @Get(':bookingId')
  get(@Param('bookingId') bookingId: string) {
    return this.payments.findOne({ where: { booking: { id: bookingId } } });
  }
}
