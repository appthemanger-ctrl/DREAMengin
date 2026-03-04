import Nav from '@/components/Nav'
import Image from 'next/image'
import { ShoppingBag, Star } from 'lucide-react'

const items = [
  { id: 1, title: 'DREAM Logo Pack',    price: 29, img: '/logo_DREAM_transparent.png', seller: 'dreamr_jay',    rating: 4.9 },
  { id: 2, title: 'ENGIN Sprite Sheet', price: 19, img: '/sprite_2x_transparent.png',  seller: 'idari_builds',  rating: 4.8 },
  { id: 3, title: 'Character Bundle',   price: 49, img: '/images/hero3.PNG',            seller: 'boogie_street', rating: 5.0 },
  { id: 4, title: 'Full Logo Variants', price: 39, img: '/logo_transparent.png',        seller: 'dreamr_jay',    rating: 4.7 },
]

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="de-section">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold de-gradient-text">Marketplace</h1>
            <p className="text-slate-400 mt-1">Buy and sell digital goods from real creators.</p>
          </div>
          <button className="de-btn-gold"><ShoppingBag size={16}/> Sell</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {items.map(item => (
            <div key={item.id} className="de-card overflow-hidden group hover:shadow-gold-glow transition-all cursor-pointer">
              <div className="relative h-40 bg-de-navy flex items-center justify-center p-4">
                <Image src={item.img} alt={item.title} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm mb-1 group-hover:text-de-gold transition-colors">{item.title}</p>
                <p className="text-xs text-slate-500 mb-2">@{item.seller}</p>
                <div className="flex items-center justify-between">
                  <span className="de-badge de-badge-gold">${item.price}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Star size={10} className="text-de-gold-light" />{item.rating}</span>
                </div>
                <button className="de-btn-primary text-xs w-full justify-center mt-3 py-2">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
