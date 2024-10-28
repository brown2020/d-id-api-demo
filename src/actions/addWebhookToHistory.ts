import { adminDb } from "@/firebase/firebaseAdmin";
import { WEBHOOK_HISTORY_COLLECTION } from "@/libs/constants";
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';


export async function addWebhookToHistory(requestCurl: string) {

    const webhookHistoryRef = adminDb.collection(WEBHOOK_HISTORY_COLLECTION);
    await webhookHistoryRef.doc(uuidv4()).set({
        request_curl: requestCurl,
        requested_at: moment().format('X')
    });

}