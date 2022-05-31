import {NextApiRequest, NextApiResponse} from 'next';
import {supabase} from '../../../libs/supabase-client';

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const {data} = await supabase.from('blvckboard').select('*');

    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({statusCode: 500, message: err.message});
  }
};

export default handler;
