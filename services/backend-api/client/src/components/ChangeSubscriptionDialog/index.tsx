import {
  Box,
  Button,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
} from "@chakra-ui/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  useCreateSubscriptionCancel,
  useCreateSubscriptionChange,
  useSubscriptionChangePreview,
} from "../../features/subscriptionProducts";
import { InlineErrorAlert } from "../InlineErrorAlert";
import { notifyError } from "../../utils/notifyError";
import { notifySuccess } from "../../utils/notifySuccess";
import { ProductKey } from "../../constants";

interface Props {
  onClose: (reopenPricing?: boolean) => void;
  details?: {
    priceId: string;
  };
  isDowngrade?: boolean;
  billingPeriodEndsAt?: string;
  products?: {
    id: ProductKey;
    name: string;
    prices: {
      id: string;
      interval: "month" | "year" | "day" | "week";
      formattedPrice: string;
      currencyCode: string;
    }[];
  }[];
}

export const ChangeSubscriptionDialog = ({
  details,
  onClose,
  isDowngrade,
  billingPeriodEndsAt,
  products,
}: Props) => {
  const priceId = details?.priceId;
  const product =
    priceId && products
      ? products.find((p) => p.prices.find((pr) => pr.id === priceId))
      : undefined;

  const price = product?.prices.find((p) => p.id === priceId);

  const isChangingToFree = priceId?.startsWith("free");
  const { mutateAsync, status: createStatus } = useCreateSubscriptionChange();
  const { mutateAsync: cancelSubscription, status: cancelStatus } = useCreateSubscriptionCancel();
  const initialRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const isOpen = !!priceId;
  const { data, error } = useSubscriptionChangePreview({
    data:
      priceId && !isChangingToFree
        ? {
            priceId,
          }
        : undefined,
  });

  const onConfirm = async () => {
    if (!priceId) {
      return;
    }

    if ((!isChangingToFree && !data) || createStatus === "loading" || cancelStatus === "loading") {
      return;
    }

    try {
      if (isChangingToFree) {
        await cancelSubscription();
      } else {
        await mutateAsync({
          data: {
            priceId,
          },
        });
      }

      notifySuccess(t("common.success.savedChanges"));
      onClose();
    } catch (e) {
      notifyError(t("common.errors.somethingWentWrong"), (e as Error).message);
    }
  };

  const isLoading = !data && !isChangingToFree;

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
          {isLoading && (
            <Flex justifyContent="center" m={6}>
              <Spinner />
            </Flex>
          )}
          {error && <InlineErrorAlert title="Failed to get preview" description={error.message} />}
          {!isLoading && isChangingToFree && (
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
          <Box aria-live="polite" aria-atomic="true">
            {!isLoading && !isChangingToFree && (
              <Stack>
                <Stack spacing={8}>
                  <Stack>
                    <Box>
                      <Text>{product?.name}</Text>
                      {!data && <Skeleton width={64} height={12} mt={2} />}
                      {data && price && (
                        <Text fontSize="xx-large" fontWeight={700}>
                          {price?.formattedPrice}/{price?.interval}
                        </Text>
                      )}
                      {!data && <Skeleton width={64} height={6} mt={2} />}
                      {data && (
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
                      )}
                    </Box>
                  </Stack>
                  <TableContainer pt={4} tabIndex={-1}>
                    <Table variant="unstyled">
                      <Tbody>
                        <Tr>
                          <Td padding={0}>
                            <Text>Subtotal</Text>
                            <Text color="whiteAlpha.700" fontSize={14}>
                              for remaining time on new plan
                            </Text>
                          </Td>
                          <Td textAlign="right" p={0}>
                            <Flex justifyContent="flex-end">
                              {!data && <Skeleton width={16} height={6} />}
                              {data && (
                                <Text>{data.data.immediateTransaction.subtotalFormatted}</Text>
                              )}
                            </Flex>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td pt={4} pl={0} pr={0} pb={0}>
                            <Text>Tax</Text>
                            <Text color="whiteAlpha.700" fontSize={14}>
                              Included in plan price
                            </Text>
                          </Td>
                          <Td textAlign="right" p={0}>
                            <Flex justifyContent="flex-end">
                              {!data && <Skeleton width={16} height={6} />}
                              {data && <Text>{data.data.immediateTransaction.taxFormatted}</Text>}
                            </Flex>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td pt={4} pl={0} pr={0} pb={0}>
                            <Text>Total</Text>
                          </Td>
                          <Td textAlign="right" p={0}>
                            <Flex justifyContent="flex-end">
                              {!data && <Skeleton width={16} height={6} />}
                              {data && <Text>{data.data.immediateTransaction.totalFormatted}</Text>}
                            </Flex>
                          </Td>
                        </Tr>
                        {data && data.data.immediateTransaction.credit !== "0" && (
                          <Tr>
                            <Td pt={4} pl={0} pr={0} pb={0}>
                              <Text>Credit</Text>
                              <Text color="whiteAlpha.700" fontSize={14}>
                                Includes refund for time remaining on current plan
                              </Text>
                            </Td>
                            <Td p={0} textAlign="right">
                              <Flex justifyContent="flex-end">
                                {!data && <Skeleton width={16} height={6} />}
                                {data && (
                                  <Text color="green.200">
                                    -{data.data.immediateTransaction.creditFormatted}
                                  </Text>
                                )}
                              </Flex>
                            </Td>
                          </Tr>
                        )}
                        <Tr>
                          <Td pt={8} pl={0} pr={0} pb={0}>
                            <Text fontWeight="bold">Due Today</Text>
                          </Td>
                          <Td textAlign="right" pt={8} pl={0} pr={0} pb={0}>
                            <Flex justifyContent="flex-end">
                              {!data && <Skeleton width={16} height={6} />}
                              {data && (
                                <Text fontWeight="bold">
                                  {data.data.immediateTransaction.grandTotalFormatted}
                                </Text>
                              )}
                            </Flex>
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Stack>
                <Text color="whiteAlpha.700" pt={4}>
                  By proceeding, you are agreeing to our{" "}
                  <Link target="_blank" href="https://monitorss.xyz/terms" color="blue.300">
                    terms and conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    target="_blank"
                    color="blue.300"
                    href="https://monitorss.xyz/privacy-policy"
                  >
                    privacy policy
                  </Link>
                  .
                </Text>
              </Stack>
            )}
          </Box>
        </ModalBody>
        <ModalFooter>
          {!isLoading && (
            <>
              <Button variant="ghost" mr={3} onClick={() => onClose(true)} ref={initialRef}>
                <span>Cancel</span>
              </Button>
              <Button
                colorScheme={!isDowngrade ? "blue" : "red"}
                onClick={onConfirm}
                aria-disabled={
                  (!isChangingToFree && !data) ||
                  createStatus === "loading" ||
                  cancelStatus === "loading"
                }
              >
                <span>
                  {!isDowngrade && "Confirm Payment"}
                  {isDowngrade && "Confirm Downgrade"}
                </span>
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
