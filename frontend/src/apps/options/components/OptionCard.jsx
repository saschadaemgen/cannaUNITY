// frontend/src/apps/options/components/OptionCard.jsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const OptionCard = ({ title, value, description }) => (
  <Card className="shadow-xl hover:shadow-2xl transition duration-300">
    <CardContent>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-2 text-green-600 font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default OptionCard;
