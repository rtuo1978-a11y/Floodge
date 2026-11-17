// Carte simplifiée pour l'aperçu web (react-native-maps ne fonctionne que sur téléphone)
import React, { createContext, forwardRef, useContext, useImperativeHandle, useState } from 'react';

const Ctx = createContext(null);
export const PROVIDER_GOOGLE = 'google';

const MapView = forwardRef(function MapView({ initialRegion, style, children, onLongPress }, ref) {
  const [taille, setTaille] = useState({ w: 390, h: 760 });
  const region = initialRegion;
  useImperativeHandle(ref, () => ({ fitToCoordinates() {}, animateToRegion() {} }));
  const proj = (lat, lng) => ({
    x: ((lng - (region.longitude - region.longitudeDelta / 2)) / region.longitudeDelta) * taille.w,
    y: (((region.latitude + region.latitudeDelta / 2) - lat) / region.latitudeDelta) * taille.h,
  });
  const fond = {
    position: 'absolute', inset: 0, overflow: 'hidden',
    background: 'linear-gradient(170deg,#F3F6EE 0%,#EDF2E8 50%,#E3EEF5 68%,#D3E6F3 100%)',
  };
  return React.createElement('div', {
    style: fond,
    ref: (el) => { if (el && (el.clientWidth !== taille.w || el.clientHeight !== taille.h)) setTaille({ w: el.clientWidth, h: el.clientHeight }); },
    onContextMenu: (e) => { e.preventDefault(); },
  },
    React.createElement('svg', { width: taille.w, height: taille.h, style: { position: 'absolute', inset: 0 } },
      // lagune Ébrié (décor)
      React.createElement('path', { d: `M0 ${taille.h*0.66} C ${taille.w*0.25} ${taille.h*0.58}, ${taille.w*0.5} ${taille.h*0.72}, ${taille.w} ${taille.h*0.62} L ${taille.w} ${taille.h*0.74} C ${taille.w*0.6} ${taille.h*0.82}, ${taille.w*0.3} ${taille.h*0.7}, 0 ${taille.h*0.78} Z`, fill: '#bcd7ee' }),
      // routes (décor)
      ...[[0.1,0.2,0.9,0.35],[0.05,0.5,0.95,0.45],[0.45,0.05,0.5,0.95],[0.2,0.9,0.75,0.1]].map(([a,b,c,d],i) =>
        React.createElement('line', { key: 'r'+i, x1: a*taille.w, y1: b*taille.h, x2: c*taille.w, y2: d*taille.h, stroke: '#ffffff', strokeWidth: 5, strokeLinecap: 'round' })),
      React.createElement(Ctx.Provider, { value: proj }, children),
    ),
    React.createElement('div', { style: { position: 'absolute', right: 6, bottom: 2, fontSize: 9, color: '#789', fontFamily: 'sans-serif' } }, 'Aperçu web — Google Maps sur téléphone'),
  );
});
export default MapView;

export function Polygon({ coordinates, fillColor, strokeColor, strokeWidth = 1, onPress }) {
  const proj = useContext(Ctx);
  const pts = coordinates.map((c) => { const p = proj(c.latitude, c.longitude); return `${p.x},${p.y}`; }).join(' ');
  return React.createElement('polygon', { points: pts, fill: fillColor, stroke: strokeColor, strokeWidth, onClick: onPress, style: { cursor: onPress ? 'pointer' : 'default' } });
}
export function Polyline({ coordinates, strokeColor, strokeWidth = 3 }) {
  const proj = useContext(Ctx);
  const pts = coordinates.map((c) => { const p = proj(c.latitude, c.longitude); return `${p.x},${p.y}`; }).join(' ');
  return React.createElement('polyline', { points: pts, fill: 'none', stroke: strokeColor, strokeWidth });
}
export function Marker({ coordinate, pinColor = '#B91C1C', title, children }) {
  const proj = useContext(Ctx);
  const { x, y } = proj(coordinate.latitude, coordinate.longitude);
  // Marqueur personnalisé (enfant) → pastille ronde ; sinon épingle classique
  if (children) {
    return React.createElement('g', { transform: `translate(${x},${y})` },
      React.createElement('title', null, title),
      React.createElement('circle', { r: 15, fill: pinColor, stroke: '#fff', strokeWidth: 3 }),
      React.createElement('path', { d: 'M-6 2 c 2 -2 4 -2 6 0 s 4 2 6 0', stroke: '#fff', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' }),
      React.createElement('path', { d: 'M-6 -4 c 2 -2 4 -2 6 0 s 4 2 6 0', stroke: '#fff', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' }));
  }
  return React.createElement('g', { transform: `translate(${x},${y})` },
    React.createElement('title', null, title),
    React.createElement('path', { d: 'M0 0 C -9 -12, -9 -24, 0 -26 C 9 -24, 9 -12, 0 0 Z', fill: pinColor, stroke: '#fff', strokeWidth: 1.5 }),
    React.createElement('circle', { cy: -18, r: 3.5, fill: '#fff' }));
}
export const Callout = () => null;
export const Circle = () => null;
