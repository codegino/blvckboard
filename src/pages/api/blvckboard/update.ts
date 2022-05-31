import {NextApiRequest, NextApiResponse} from 'next';
import {supabase} from '../../../libs/supabase-client';

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const {body} = _req;

  try {
    const {coordinate, color, address, comment, symbol} = body;

    if (!coordinate || !color || !address) {
      return res
        .status(400)
        .json({statusCode: 400, message: 'Unable to update blvckboard'});
    }

    let {data: cell} = await supabase
      .from('blvckboard')
      .select('coordinate')
      .eq('coordinate', coordinate)
      .single();

    if (cell) {
      const {data} = await supabase
        .from('blvckboard')
        .update({color, comment, symbol, owner: address})
        .select('coordinate,color,symbol')
        .eq('coordinate', coordinate)
        .single();
      return res.status(200).json(data);
    } else {
      const {data, error} = await supabase
        .from('blvckboard')
        .insert({coordinate, color, comment, symbol, owner: address})
        .select('coordinate,color,symbol')
        .single();
      return res.status(200).json(data);
    }
  } catch (err: any) {
    res.status(500).json({statusCode: 500, message: err.message});
  }
};

export default handler;
