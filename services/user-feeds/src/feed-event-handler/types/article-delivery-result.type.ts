import { JobResponse } from "@synzen/discord-rest";
import {
  JobData,

} from "@synzen/discord-rest/dist/RESTConsumer";

export interface ArticleDeliveryResult {
  job: JobData;
  result: JobResponse<any> | any;
}
