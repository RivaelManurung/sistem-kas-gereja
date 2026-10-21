import EventForm from './form';
import { type AttributeDefinition } from '@/types/attributes';

export default function EventCreate({
    attributeDefinitions = [],
}: {
    attributeDefinitions?: AttributeDefinition[];
}) {
    return <EventForm event={null} attributeDefinitions={attributeDefinitions} customAttributes={{}} />;
}
