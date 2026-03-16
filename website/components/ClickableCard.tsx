import React from 'react';
import { Card, Heading, Text } from '@radix-ui/themes';

interface ClickableCardProps {
  title: string;
  description: string;
  link: string;
}

const ClickableCard = ({title, description, link}: ClickableCardProps) => {
  return (
    <Card asChild size="3" variant="surface" className="w-full hover:shadow-lg transition-shadow duration-300">
      <a href={link}>
        <Heading as="h2" size="5" mb="2">{title}</Heading>
        <Text as="p" color="gray">{description}</Text>
      </a>
    </Card>
  );
};

export default ClickableCard;
