import { FaCircleExclamation, FaClock, FaPause } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import { UserFeedComputedStatus } from "../../types";
import getChakraColor from "../../../../utils/getChakraColor";

interface Props {
  status: UserFeedComputedStatus;
}

export const UserFeedStatusTag: React.FC<Props> = ({ status }) => {
  if (status === UserFeedComputedStatus.RequiresAttention) {
    return <FaCircleExclamation fontSize={18} color={getChakraColor("red.300")} />;
  }

  if (status === UserFeedComputedStatus.Retrying) {
    return <FaClock fontSize={18} />;
  }

  if (status === UserFeedComputedStatus.ManuallyDisabled) {
    return <FaPause opacity="0.5" fontSize={18} />;
  }

  return <FaCheckCircle color={getChakraColor("green.500")} fontSize={18} />;
};
