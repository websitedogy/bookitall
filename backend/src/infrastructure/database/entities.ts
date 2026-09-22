import { User } from '../../modules/users/entities/user.entity';
import { Hotel } from '../../modules/hotels/entities/hotel.entity';
import { HotelRoomType } from '../../modules/hotels/entities/hotel-room-type.entity';
import { Tour } from '../../modules/tours/entities/tour.entity';
import { Vehicle } from '../../modules/cabs/entities/vehicle.entity';
import { HomeService } from '../../modules/home-services/entities/home-service.entity';
import { Booking, BookingStatusHistory } from '../../modules/booking-engine/entities/booking.entity';
import { Payment } from '../../modules/payments/entities/payment.entity';
import { Wallet, WalletTransaction } from '../../modules/wallet/entities/wallet.entity';
import { CommissionLedger, CommissionRule } from '../../modules/commission/entities/commission.entity';
import { Payout } from '../../modules/payout/entities/payout.entity';
import { LocationPing } from '../../modules/gps/entities/location-ping.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { PushSubscription } from '../../modules/notifications/entities/push-subscription.entity';
import { VendorListing } from '../../modules/vendor-listings/entities/vendor-listing.entity';
import { SupportTicket } from '../../modules/admin/entities/support-ticket.entity';
import { SupportMessage } from '../../modules/admin/entities/support-message.entity';
import { PlatformService } from '../../modules/platform-services/entities/platform-service.entity';

export const ALL_ENTITIES = [
  User,
  Hotel,
  HotelRoomType,
  Tour,
  Vehicle,
  HomeService,
  VendorListing,
  Booking,
  BookingStatusHistory,
  Payment,
  Wallet,
  WalletTransaction,
  CommissionRule,
  CommissionLedger,
  Payout,
  LocationPing,
  Notification,
  PushSubscription,
  SupportTicket,
  SupportMessage,
  PlatformService,
];
