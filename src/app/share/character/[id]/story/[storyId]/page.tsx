import StoryView from '@/components/StoryView';
import { use } from 'react';

export default function ShareCharacterStoryPage({ params }: { params: Promise<{ id: string, storyId: string }> }) {
  const { id, storyId } = use(params);
  return <StoryView targetId={id} storyId={storyId} type="character" isPublicShare={true} />;
}
