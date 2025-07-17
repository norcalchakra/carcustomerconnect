import OpenAI from 'openai';
import { Vehicle, VehicleEvent } from './api';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you should use a server-side API
});

export interface CaptionRequest {
  vehicle: Vehicle;
  event: VehicleEvent;
  dealershipName: string;
  additionalNotes?: string;
}

export interface CaptionResponse {
  caption: string;
  hashtags: string[];
}

/**
 * Generates a social media caption based on vehicle details and event type
 */
export const generateCaption = async (request: CaptionRequest): Promise<CaptionResponse> => {
  const { vehicle, event, dealershipName, additionalNotes } = request;
  
  // Prepare vehicle details
  const vehicleDetails = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const vehicleFeatures = [
    vehicle.color ? `Color: ${vehicle.color}` : null,
    vehicle.mileage ? `Mileage: ${vehicle.mileage}` : null,
    vehicle.price ? `Price: $${vehicle.price}` : null,
  ].filter(Boolean).join(', ');
  
  // Map event type to marketing context
  const eventContext = getEventContext(event.event_type);
  
  // Prepare the prompt
  const prompt = `
    Create an engaging social media post for a car dealership about a ${vehicleDetails}.
    
    Vehicle details:
    - ${vehicleFeatures}
    - Stock #: ${vehicle.stock_number}
    - VIN: ${vehicle.vin}
    
    Event type: ${eventContext.description}
    
    ${additionalNotes ? `Additional notes: ${additionalNotes}` : ''}
    
    Dealership name: ${dealershipName}
    
    Please write a compelling, conversational caption that highlights the vehicle's features and creates urgency based on the event type.
    The caption should be 2-3 sentences, followed by a call to action.
    
    Also include 3-5 relevant hashtags that would work well on social media.
    
    Format your response as:
    CAPTION: [your caption text]
    HASHTAGS: [comma-separated hashtags without the # symbol]
  `;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a marketing expert for auto dealerships. Your job is to create engaging social media content that drives interest and leads."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Parse the response
    const content = completion.choices[0]?.message?.content || '';
    
    // Extract caption and hashtags
    const captionMatch = content.match(/CAPTION:\s*([\s\S]*?)(?=HASHTAGS:|$)/i);
    const hashtagsMatch = content.match(/HASHTAGS:\s*(.*?)$/i);
    
    const caption = captionMatch ? captionMatch[1].trim() : '';
    const hashtagsString = hashtagsMatch ? hashtagsMatch[1].trim() : '';
    const hashtags = hashtagsString.split(',').map(tag => tag.trim());
    
    return {
      caption,
      hashtags
    };
  } catch (error) {
    console.error('Error generating caption:', error);
    throw new Error('Failed to generate caption. Please try again.');
  }
};

// Helper function to get marketing context based on event type
function getEventContext(eventType: string): { description: string, tone: string } {
  switch (eventType) {
    case 'acquisition':
      return {
        description: 'New arrival / Just acquired',
        tone: 'excitement, anticipation'
      };
    case 'service_complete':
      return {
        description: 'Service completed, vehicle being prepared for sale',
        tone: 'informative, quality assurance'
      };
    case 'ready_for_sale':
      return {
        description: 'Vehicle is ready for sale and on the lot',
        tone: 'promotional, urgency'
      };
    case 'sold':
      return {
        description: 'Vehicle has been sold to a happy customer',
        tone: 'celebratory, gratitude'
      };
    default:
      return {
        description: 'Vehicle update',
        tone: 'informative'
      };
  }
}
