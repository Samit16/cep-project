import { Event } from '@/types';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Heritage Gala & Cultural Night',
    date: '2024-04-15',
    time: '6:00 PM',
    location: 'Grand Ballroom, Samaj Center',
    address: 'Grand Ballroom, Samaj Center, Dadar',
    description: 'An evening of culture, tradition, and connecting with the community. Join us for performances, dinner, and heritage celebrations.',
    imageUrl: '/images/events/event1.jpg',
    importantNotes: 'Dress code: Traditional attire recommended',
    committeeContacts: [
      { name: 'Rajesh Kothari', phone: '+91 98200 12345' },
      { name: 'Amit Gada', phone: '+91 98765 43210' },
    ],
  },
  {
    id: '2',
    title: 'Annual General Meeting 2024',
    date: '2024-05-20',
    time: '10:00 AM',
    location: 'Convention Hall, Mumbai',
    address: 'Convention Hall, Andheri East, Mumbai',
    description: 'Annual meeting to discuss community progress, finances, and upcoming initiatives.',
    imageUrl: '/images/events/event2.png',
    committeeContacts: [
      { name: 'Viren Shah', phone: '+91 99887 76655' },
    ],
  },
];
