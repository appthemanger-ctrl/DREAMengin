import Nav from '@/components/Nav'
import Image from 'next/image'
import { Package } from 'lucide-react'

const products = [
  { id: 1, name: 'DREAMengin Hoodie',    price: 65, tag: 'New', img: '/logo_transparent.png' },
  { id: 2, name: 'Logo Cap',             price: 35, tag: 'Hot', img: '/logo_DREAM_transparent.png' },
  { id: 3, name: 'Creator Sticker Pack', price: 12, tag: '',    img: '/logo_ENGIN_transparent.png' },
  { id: 4, name: 'Limited Edition Tee',  price: 55, tag: 'Ltd', img: '/sprite_transparent.png' },
]

export default function Shop() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="de-section">
        <h1 className="text-4xl font-bold de-gradient-text mb-2">Shop</h1>
        <p className="text-slate-400 mb-10">Official DREAMengin merch. Wear the dream.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} className="de-card overflow-hidden group hover:shadow-gold-glow transition-all">
              <div className="relative h-52 bg-de-navy flex items-center justify-center">
                <Image src={p.img} alt={p.name} fill className="object-contain p-8 group-hover:scale-105 transition-transform duration-300" />
                {p.tag && <span className="absolute top-3 right-3 de-badge de-badge-gold">{p.tag}</span>}
              </div>
              <div className="p-4">
                <p className="font-semibold mb-2 group-hover:text-de-gold transition-colors">{p.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-de-gold-light font-bold">${p.price}</span>
                  <button className="de-btn-primary text-xs py-1.5 px-4"><Package size={12}/> Buy</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
