import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  ValidationPipe,
} from "@nestjs/common";
import { CreditBalanceDetails } from "../../common/types/credit-balance-details.type";
import { SubscriptionDetails } from "../../common/types/subscription-details.type";
import { DiscordAccessToken } from "../discord-auth/decorators/DiscordAccessToken";
import { SessionAccessToken } from "../discord-auth/types/SessionAccessToken.type";
import { UpdateMeDto } from "./dto/update-me-input.dto";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("@me")
  async getMe(
    @DiscordAccessToken()
    { discord: { id: discordUserId } }: SessionAccessToken
  ) {
    const user = await this.usersService.getByDiscordId(discordUserId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.formatUserMe(user);
  }

  @Patch("@me")
  async updateMe(
    @DiscordAccessToken()
    { discord: { id: discordUserId } }: SessionAccessToken,
    @Body(ValidationPipe) updateMeInput: UpdateMeDto
  ) {
    const user = await this.usersService.updateUserByDiscordId(
      discordUserId,
      updateMeInput
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.formatUserMe(user);
  }

  private formatUserMe({
    user,
    subscription,
    creditBalance,
    isOnPatreon,
  }: {
    user: User;
    creditBalance: CreditBalanceDetails;
    subscription: SubscriptionDetails;
    isOnPatreon?: boolean;
  }) {
    return {
      result: {
        id: user._id,
        discordUserId: user.discordUserId,
        email: user.email,
        preferences: user.preferences,
        subscription,
        creditBalance,
        isOnPatreon,
        enableBilling: user.enableBilling,
      },
    };
  }
}
