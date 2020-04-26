exports.inline_keyboard = (id, desc) => {
    let row1 = [
    {
        text: "Detail",
        callback_data: JSON.stringify({ id: id, action: 'desc' })
    },
    {
        text: "Add to Cart",
        callback_data: JSON.stringify({ id: id, action: 'cart' })
    }
    ];
    if (desc) row1.shift();
    let row2 = [
    {
        text: "<",
        callback_data: JSON.stringify({ id: id, action: 'prev' })
    },
    {
        text: ">",
        callback_data: JSON.stringify({ id: id, action: 'next' })
    }
    ];
    return [row1, row2]
  }