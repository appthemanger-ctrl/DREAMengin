export function detectWidgetType(url: string): { type: string; embed: string } {
  const u = url || ''
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    return { type: 'video', embed: u.replace('watch?v=', 'embed/') }
  }
  if (u.includes('spotify.com/track')) {
    return { type: 'music', embed: u.replace('/track/', '/embed/track/') }
  }
  if (u.includes('twitter.com') || u.includes('x.com')) {
    return { type: 'tweet', embed: u }
  }
  return { type: 'link', embed: u }
}
