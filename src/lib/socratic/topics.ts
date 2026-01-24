export const SOCRATIC_TOPICS = [
  'The Role of AI Regulation in Democratic Societies',
  'U.S. Midterm Elections and the Future of Executive Power',
  'Climate Change vs. Economic Growth: Prioritizing One Over the Other?',
  'Immigration Policy and National Security',
  'The Decline of Multilateralism and Rise of Multipolar World Order',
  'Government Intervention in Healthcare and Public Health',
  'U.S. Foreign Policy in the Western Hemisphere (e.g., Venezuela, Monroe Doctrine Revival)',
  'The Impact of Protectionism and Trade Wars on Global Prosperity',
  'Democracy Under Pressure: Political Polarization and Institutional Trust',
  "China's Global Influence vs. U.S. Leadership",
] as const;

export type SocraticTopic = typeof SOCRATIC_TOPICS[number];

export function isValidTopic(topic: string): topic is SocraticTopic {
  return SOCRATIC_TOPICS.includes(topic as SocraticTopic);
}
