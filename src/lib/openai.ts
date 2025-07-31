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
  
  // Map event type to marketing context
  const eventContext = getEventContext(event.event_type);
  
  // Prepare vehicle specifications with only existing properties
  const vehicleSpecs = [
    `Year: ${vehicle.year}`,
    `Make: ${vehicle.make}`,
    `Model: ${vehicle.model}`,
    vehicle.color ? `Color: ${vehicle.color}` : null,
    vehicle.mileage ? `Mileage: ${vehicle.mileage.toLocaleString()} miles` : null,
    vehicle.price ? `Price: $${vehicle.price.toLocaleString()}` : null,
    vehicle.stock_number ? `Stock #: ${vehicle.stock_number}` : null,
    vehicle.vin ? `VIN: ${vehicle.vin}` : null,
    vehicle.features ? `Features: ${Array.isArray(vehicle.features) ? vehicle.features.join(', ') : vehicle.features}` : null,
    vehicle.description ? `Description: ${vehicle.description}` : null
  ].filter(Boolean);

  // Prepare the prompt with explicit instructions for Facebook post
  const prompt = `
    Create an engaging FACEBOOK POST for a car dealership about this vehicle:
    ${vehicle.year} ${vehicle.make} ${vehicle.model}
    
    VEHICLE SPECIFICATIONS:
    ${vehicleSpecs.join('\n    ')}
    
    EVENT CONTEXT:
    - Type: ${eventContext.description}
    - Desired Tone: ${eventContext.tone}
    
    ${additionalNotes ? `ADDITIONAL INSTRUCTIONS: ${additionalNotes}\n` : ''}
    DEALERSHIP NAME: ${dealershipName}
    
    POST REQUIREMENTS:
    1. Write a compelling, conversational caption (2-3 sentences)
    2. HIGHLIGHT the most attractive features of this specific vehicle
    3. Include a clear CALL TO ACTION based on the event type
    4. Use an enthusiastic but professional tone
    5. Include 3-5 relevant, specific hashtags
    6. Keep it concise and scannable for social media
    
    IMPORTANT: Focus on what makes this vehicle special and why someone would want to buy it.
    
    Format your response exactly as follows:
    CAPTION: [your caption text here]
    HASHTAGS: [comma,separated,hashtags,no,spaces]
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
