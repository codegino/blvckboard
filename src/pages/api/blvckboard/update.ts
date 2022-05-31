import {NextApiRequest, NextApiResponse} from 'next';
import {supabase} from '../../../libs/supabase-client';

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const {body} = _req;
  try {
    let newBody = JSON.parse(body);
    const coordinate = newBody.coordinate;
    const color = newBody.color;

    let {data: cell, error} = await supabase
      .from('blvckboard')
      .select('coordinate')
      .eq('coordinate', coordinate)
      .single();

    if (cell) {
      const {data} = await supabase
        .from('blvckboard')
        .update({color})
        .select('coordinate,color')
        .eq('coordinate', coordinate)
        .single();
      return res.status(200).json(data);
    } else {
      const {data, error} = await supabase
        .from('blvckboard')
        .insert({coordinate, color})
        .select('coordinate,color')
        .single();
      return res.status(200).json(data);
    }
  } catch (err: any) {
    res.status(500).json({statusCode: 500, message: err.message});
  }
};

export default handler;
