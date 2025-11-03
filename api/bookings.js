import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // 从KV获取预定数据
    let bookings = await kv.get('bookings');
    bookings = bookings ? JSON.parse(bookings) : [];
    
    // 获取所有预定
    if (req.method === 'GET') {
      return res.status(200).json(bookings);
    }
    
    // 添加预定
    if (req.method === 'POST') {
      const booking = req.body;
      booking.id = Date.now();
      booking.status = 'confirmed';
      booking.bookingTime = new Date().toISOString();
      bookings.push(booking);
      
      // 保存到KV
      await kv.set('bookings', JSON.stringify(bookings));
      return res.status(201).json(booking);
    }
    
    // 更新预定状态
    if (req.method === 'PUT') {
      const { id } = req.query;
      const booking = bookings.find(b => b.id == id);
      if (booking) {
        booking.status = 'cancelled';
        
        // 保存到KV
        await kv.set('bookings', JSON.stringify(bookings));
        return res.status(200).json(booking);
      }
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // 不支持的方法
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}