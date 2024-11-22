import CreateVideo from "@/components/create-video/CreateVideo";
import { FC } from 'react';

interface Props {
    params: {
        id: string;
    };
}

const EditVideoPage: FC<Props> = ({ params }) => {
    return <CreateVideo video_id={params.id} />;
}

export default EditVideoPage;