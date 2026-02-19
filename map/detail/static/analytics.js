// Minimal GA4 ecommerce helpers for the detail page (gtag.js direct integration)
(function () {
  function safeGtag() {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag.apply(null, arguments);
        return true;
      }
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(arguments);
        return true;
      }
    } catch (_) {
      // ignore
    }
    return false;
  }

  function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function buildItemFromProperty(property, producer) {
    if (!property) return null;
    const rent = toNumber(property.rent);
    const id = property.id ?? property.originalId ?? '';
    const name = property.name ?? '';
    if (!id || !name) return null;

    return {
      item_id: String(id),
      item_name: String(name),
      item_category: 'rent',
      item_variant: producer ? String(producer) : undefined,
      price: rent || undefined
    };
  }

  function buildEcomParams(item, property) {
    const value = toNumber(property?.rent);
    return {
      currency: 'JPY',
      value,
      items: item ? [item] : []
    };
  }

  function viewItem(property, producer, dedupeKey) {
    const item = buildItemFromProperty(property, producer);
    if (!item) return false;

    if (dedupeKey) {
      try {
        if (sessionStorage.getItem(dedupeKey) === '1') return false;
        sessionStorage.setItem(dedupeKey, '1');
      } catch (_) {
        // ignore sessionStorage errors, still attempt sending once
      }
    }

    return safeGtag('event', 'view_item', buildEcomParams(item, property));
  }

  function addToCart(property, producer) {
    const item = buildItemFromProperty(property, producer);
    if (!item) return false;
    return safeGtag('event', 'add_to_cart', buildEcomParams(item, property));
  }

  window.GA4Ecom = window.GA4Ecom || {};
  window.GA4Ecom.safeGtag = safeGtag;
  window.GA4Ecom.buildItemFromProperty = buildItemFromProperty;
  window.GA4Ecom.viewItem = viewItem;
  window.GA4Ecom.addToCart = addToCart;
})();
