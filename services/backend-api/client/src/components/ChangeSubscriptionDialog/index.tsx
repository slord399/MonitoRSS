import {
  Box,
  Button,
  Center,
  Divider,
  HStack,
  Heading,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useCreateSubscriptionCancel,
  useCreateSubscriptionChange,
  useSubscriptionChangePreview,
  useSubscriptionProducts,
} from "../../features/subscriptionProducts";
import { InlineErrorAlert } from "../InlineErrorAlert";
import { notifyError } from "../../utils/notifyError";
import { notifySuccess } from "../../utils/notifySuccess";
import { useUserMe } from "../../features/discordUser";

interface Props {
  onClose: (reopenPricing?: boolean) => void;
  currencyCode: string;
  details?: {
    priceId: string;
  };
  isDowngrade?: boolean;
  billingPeriodEndsAt?: string;
}

export const ChangeSubscriptionDialog = ({
  currencyCode,
  details,
  onClose,
  isDowngrade,
  billingPeriodEndsAt,
}: Props) => {
  const priceId = details?.priceId;
  const [subscriptionPollDate, setSubscriptionPollDate] = useState<Date>();
  const { data: userMeData } = useUserMe({
    checkForSubscriptionUpdateAfter: subscriptionPollDate,
  });
  const { data: productsData } = useSubscriptionProducts({
    currency: currencyCode,
  });
  const product = priceId
    ? productsData?.data.products.find((p) => p.prices.find((pr) => pr.id === priceId))
    : undefined;

  const price = product?.prices.find((p) => p.id === priceId);

  const isChangingToFree = product?.id === "free";
  const { mutateAsync, status: createStatus } = useCreateSubscriptionChange();
  const { mutateAsync: cancelSubscription, status: cancelStatus } = useCreateSubscriptionCancel();
  const initialRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const isOpen = !!(priceId && currencyCode);
  const { data, status, error } = useSubscriptionChangePreview({
    data:
      currencyCode && priceId && !isChangingToFree
        ? {
            currencyCode,
            priceId,
          }
        : undefined,
  });

  const onConfirm = async () => {
    if (!priceId) {
      return;
    }

    try {
      const start = new Date();

      if (isChangingToFree) {
        await cancelSubscription();
      } else {
        await mutateAsync({
          data: {
            priceId,
            currencyCode,
          },
        });
      }

      setSubscriptionPollDate(start);
    } catch (e) {
      notifyError(t("common.errors.somethingWentWrong"), (e as Error).message);
    }
  };

  const subscriptionUpdatedDate = userMeData?.result.subscription.updatedAt;

  useEffect(() => {
    if (!subscriptionUpdatedDate || !subscriptionPollDate) {
      return;
    }

    const subscriptionUpdatedTime = new Date(subscriptionUpdatedDate).getTime();

    if (subscriptionUpdatedTime > subscriptionPollDate.getTime()) {
      onClose();
      notifySuccess("Successfully updated!");
      setSubscriptionPollDate(undefined);
    }
  }, [subscriptionUpdatedDate, subscriptionPollDate]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose(true)}
      size="xl"
      motionPreset="slideInBottom"
      isCentered
      scrollBehavior="outside"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      initialFocusRef={initialRef}
    >
      <ModalOverlay backdropFilter="blur(3px)" bg="blackAlpha.700" />
      <ModalContent>
        <ModalHeader>Confirm Subscription Changes</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!isChangingToFree && status === "loading" && (
            <Center>
              <Spinner />
            </Center>
          )}
          {error && <InlineErrorAlert title="Failed to get preview" description={error.message} />}
          {isChangingToFree && (
            <Stack>
              <Text>
                Are you sure you want to cancel by downgrading to Free? You will retain your current
                plan until{" "}
                {billingPeriodEndsAt &&
                  new Date(billingPeriodEndsAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                .
              </Text>
            </Stack>
          )}
          {data && !isChangingToFree && (
            <Stack spacing={8}>
              <Stack spacing={8}>
                <Stack>
                  <Box>
                    <Text>{product?.name}</Text>
                    <Heading size="lg">
                      {price?.formattedPrice}/{price?.interval}
                    </Heading>
                    <Text color="whiteAlpha.700">
                      {new Date(
                        data.data.immediateTransaction.billingPeriod.startsAt
                      ).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" - "}
                      {new Date(
                        data.data.immediateTransaction.billingPeriod.endsAt
                      ).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </Box>
                </Stack>
                <Divider />
                <Stack>
                  <HStack justifyContent="space-between">
                    <Box>
                      <Text>Subtotal</Text>
                      <Text color="whiteAlpha.700" fontSize={14}>
                        for remaining time on new plan
                      </Text>
                    </Box>
                    <Text>{data.data.immediateTransaction.subtotalFormatted}</Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Box>
                      <Text>Tax</Text>
                      <Text color="whiteAlpha.700" fontSize={14}>
                        Included in plan price
                      </Text>
                    </Box>
                    <Text>{data.data.immediateTransaction.taxFormatted}</Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Box>
                      <Text>Total</Text>
                    </Box>
                    <Text>{data.data.immediateTransaction.totalFormatted}</Text>
                  </HStack>
                  {data.data.immediateTransaction.credit !== "0" && (
                    <HStack justifyContent="space-between">
                      <Box>
                        <Text>Credit</Text>
                        <Text color="whiteAlpha.700" fontSize={14}>
                          Includes refund for time remaining on current plan
                        </Text>
                      </Box>
                      <Text color="green.200">
                        -{data.data.immediateTransaction.creditFormatted}
                      </Text>
                    </HStack>
                  )}
                  <Divider my={4} />
                  <HStack justifyContent="space-between">
                    <Text fontWeight="semibold">Due Today</Text>
                    <Text fontWeight="bold">
                      {data.data.immediateTransaction.grandTotalFormatted}
                    </Text>
                  </HStack>
                </Stack>
              </Stack>
              <Text color="whiteAlpha.700">
                By proceeding, you are agreeing to our{" "}
                <Link target="_blank" href="https://monitorss.xyz/terms" color="blue.300">
                  terms and conditions
                </Link>{" "}
                and{" "}
                <Link target="_blank" color="blue.300" href="https://monitorss.xyz/privacy-policy">
                  privacy policy
                </Link>
                .
              </Text>
            </Stack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={() => onClose(true)} ref={initialRef}>
            Cancel
          </Button>
          <Button
            colorScheme={!isDowngrade ? "blue" : "red"}
            onClick={onConfirm}
            isLoading={
              createStatus === "loading" || cancelStatus === "loading" || !!subscriptionPollDate
            }
            isDisabled={
              !isChangingToFree &&
              (createStatus === "loading" ||
                cancelStatus === "loading" ||
                !!subscriptionPollDate ||
                !data)
            }
          >
            {!isDowngrade && "Confirm Payment"}
            {isDowngrade && "Confirm Downgrade"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
