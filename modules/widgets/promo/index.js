export const name = 'Promo';
export const slug = 'promo';

export default function PromoWidget() {
  return (
    <div className="space-y-2">
      <div className="text-sm opacity-80">Promo</div>
      <div className="rounded-lg p-4 bg-gradient-to-br from-purple-500/20 to-cyan-400/20 border border-white/10">
        New single drops Friday 6pm. <a className="link" href="https://youtube.com" target="_blank">Set reminder →</a>
      </div>
    </div>
  );
}
