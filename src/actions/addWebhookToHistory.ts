import { adminDb } from "@/firebase/firebaseAdmin";
import { WEBHOOK_HISTORY_COLLECTION } from "@/libs/constants";
import moment from "moment";

export async function addWebhookToHistory(requestCurl: string){

    const webhookHistoryRef = adminDb.collection(WEBHOOK_HISTORY_COLLECTION);
    await webhookHistoryRef.add({
        request_curl: requestCurl,
        requested_at: moment().format('X')
    });
       
}