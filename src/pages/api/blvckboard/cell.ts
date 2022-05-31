import {NextApiRequest, NextApiResponse} from 'next';
import {supabase} from '../../../libs/supabase-client';

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const {x, y} = _req.query;

    if (!x || !y) {
      return res
        .status(400)
        .json({statusCode: 400, message: 'Unable to update blvckboard'});
    }

    const {data} = await supabase
      .from('blvckboard')
      .select('coordinate,color,symbol,owner')
      .eq('coordinate', `${x},${y}`)
      .single();

    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({statusCode: 500, message: err.message});
  }
};

export default handler;
