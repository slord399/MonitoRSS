import { PaddleSubscriptionStatus } from "../constants/paddle-subscription-status.constants";

type DateString = string;

/**
 * When user cancels, subscription updatd is sent with next_billed_at = null
 * and scheduled_change.action = "cancel"
 *
 * When user resumes, subscription updated is sent with next_billed_at populated
 * and scheduled_change = null
 *
 * When user pauses, subscription updated is sent with next_billed_at = null and
 * scheduled_change.action = "pause" with resume_at optionally populated
 *
 * Always check data.items[0].price for the latest benefits if product is changed
 */

export interface PaddleEventSubscriptionUpdated {
  event_type: "subscription.updated";
  data: {
    id: string;
    status: PaddleSubscriptionStatus;
    customer_id: string;
    created_at: string;
    custom_data: {
      userId: string;
    };
    updated_at: string;
    items: Array<{
      price: {
        id: string;
        product_id: string;
      };
    }>;
    billing_cycle: {
      interval: "month" | "year";
      frequency: number;
    };
    currency_code: string;
    next_billed_at: DateString | null;
    scheduled_change: {
      action: "cancel";
      resume_at: string | null;
      effective_at: DateString; // Date
    } | null;
    current_billing_period: {
      ends_at: DateString;
      starts_at: DateString;
    };
  };
}

export interface PaddleEventSubscriptionActivated {
  event_type: "subscription.activated";
  data: {
    id: string;
    status: PaddleSubscriptionStatus;
    customer_id: string;
    created_at: string;
    custom_data: {
      userId?: string;
    };
    updated_at: string;
    items: Array<{
      price: {
        id: string;
        product_id: string;
      };
    }>;
    billing_cycle: {
      interval: "month" | "year";
      frequency: number;
    };
    currency_code: string;
    next_billed_at: DateString | null;
    scheduled_change: null;
    current_billing_period: {
      ends_at: DateString;
      starts_at: DateString;
    };
  };
}

export interface PaddleEventSubscriptionCanceled {
  event_type: "subscription.canceled";
  data: {
    id: string;
    status: PaddleSubscriptionStatus.Cancelled;
    customer_id: string;
  };
}

/**
 * Sample payload:
 * {
  "data": {
    "id": "sub_01hb3k0jjm30nj2j21jatgkcwg",
    "items": [
      {
        "price": {
          "id": "pri_01hb3g0r4cvgsfs97ab0meqm60",
          "tax_mode": "account_setting",
          "product_id": "pro_01hb3g04x7ja5wqmnjzm557x88",
          "unit_price": {
            "amount": "500",
            "currency_code": "USD"
          },
          "description": "Tier 1 Monthly",
          "trial_period": null,
          "billing_cycle": {
            "interval": "month",
            "frequency": 1
          }
        },
        "status": "active",
        "quantity": 1,
        "recurring": true,
        "created_at": "2023-10-04T17:11:59.14Z",
        "updated_at": "2023-10-04T17:11:59.14Z",
        "trial_dates": null,
        "next_billed_at": null,
        "previously_billed_at": "2023-10-04T17:11:59.14Z"
      }
    ],
    "status": "active",
    "discount": null,
    "paused_at": null,
    "address_id": "add_01hb3jzyydq24k3yhtwqvqgzre",
    "created_at": "2023-09-24T12:35:45.364Z",
    "started_at": "2023-09-24T12:35:44.755062Z",
    "updated_at": "2023-10-04T17:18:42.577Z",
    "business_id": null,
    "canceled_at": null,
    "custom_data": null,
    "customer_id": "ctm_01hb3jya8kjtnqcewectq8cdb7",
    "billing_cycle": {
      "interval": "month",
      "frequency": 1
    },
    "currency_code": "USD",
    "next_billed_at": null,
    "billing_details": null,
    "collection_mode": "automatic",
    "first_billed_at": "2023-09-24T12:35:44.755062Z",
    "scheduled_change": {
      "action": "cancel",
      "resume_at": null,
      "effective_at": "2023-11-04T17:11:59.122Z"
    },
    "current_billing_period": {
      "ends_at": "2023-11-04T17:11:59.122Z",
      "starts_at": "2023-10-04T17:11:59.122Z"
    }
  },
  "event_id": "evt_01hbxv5wyck3jhqtvrz2fhg8ws",
  "event_type": "subscription.updated",
  "occurred_at": "2023-10-04T17:18:43.660942Z",
  "notification_id": "ntf_01hbxv5x0r6wh4812wyqz8cmbe"
}
 */

/**
 * sample payload subscription activated
 * {
  "data": {
    "id": "sub_01hby4pqqbekpph2xngqyt5xxy",
    "items": [
      {
        "price": {
          "id": "pri_01hb3g4mdqt1reaj00v5pkbghs",
          "tax_mode": "account_setting",
          "product_id": "pro_01hb3g3m6vf5gb5c4n7yak35ta",
          "unit_price": {
            "amount": "10200",
            "currency_code": "USD"
          },
          "description": "Tier 2 Yearly",
          "trial_period": null,
          "billing_cycle": {
            "interval": "year",
            "frequency": 1
          }
        },
        "status": "active",
        "quantity": 1,
        "recurring": true,
        "created_at": "2023-10-04T20:05:12.555Z",
        "updated_at": "2023-10-04T20:05:12.555Z",
        "trial_dates": null,
        "next_billed_at": "2024-10-04T20:05:10.967099Z",
        "previously_billed_at": "2023-10-04T20:05:10.967099Z"
      }
    ],
    "status": "active",
    "discount": null,
    "paused_at": null,
    "address_id": "add_01hby4nr34s5mqcp01e3s9kw1z",
    "created_at": "2023-10-04T20:05:12.555Z",
    "started_at": "2023-10-04T20:05:10.967099Z",
    "updated_at": "2023-10-04T20:05:12.555Z",
    "business_id": null,
    "canceled_at": null,
    "custom_data": {
      "userId": "64e53e3504f3ff3f1e020f1a"
    },
    "customer_id": "ctm_01hby2w9dgxrhgzh92a0emjmdc",
    "billing_cycle": {
      "interval": "year",
      "frequency": 1
    },
    "currency_code": "USD",
    "next_billed_at": "2024-10-04T20:05:10.967099Z",
    "billing_details": null,
    "collection_mode": "automatic",
    "first_billed_at": "2023-10-04T20:05:10.967099Z",
    "scheduled_change": null,
    "current_billing_period": {
      "ends_at": "2024-10-04T20:05:10.967099Z",
      "starts_at": "2023-10-04T20:05:10.967099Z"
    }
  },
  "event_id": "evt_01hby4prs82cns1yybfpweem7p",
  "event_type": "subscription.activated",
  "occurred_at": "2023-10-04T20:05:13.640616Z",
  "notification_id": "ntf_01hby4pryxb9g32mwaa8agdnws"
}
 */
