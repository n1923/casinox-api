import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    switch (req.method) {
      case 'GET':
        // Tüm kullanıcıları getir
        const users = await usersCollection.find({}).toArray();
        res.status(200).json(users);
        break;

      case 'POST':
        // Yeni kullanıcı oluştur
        const newUser = req.body;
        if (!newUser.name || !newUser.email) {
          return res.status(400).json({ error: 'Name ve email gereklidir' });
        }
        
        const result = await usersCollection.insertOne({
          ...newUser,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        res.status(201).json({
          message: 'Kullanıcı oluşturuldu',
          userId: result.insertedId
        });
        break;

      case 'PUT':
        // Kullanıcı güncelle
        const { id, ...updateData } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'Kullanıcı ID gereklidir' });
        }
        
        await usersCollection.updateOne(
          { _id: id },
          { $set: { ...updateData, updatedAt: new Date() } }
        );
        
        res.status(200).json({ message: 'Kullanıcı güncellendi' });
        break;

      case 'DELETE':
        // Kullanıcı sil
        const { userId } = req.body;
        if (!userId) {
          return res.status(400).json({ error: 'Kullanıcı ID gereklidir' });
        }
        
        await usersCollection.deleteOne({ _id: userId });
        res.status(200).json({ message: 'Kullanıcı silindi' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('MongoDB hatası:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
}