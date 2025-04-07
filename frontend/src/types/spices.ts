export interface Spice {
    id: number;
    name: string;
    description: string;
    price: string;
    image_url: string;
    product_url: string;
    add_to_cart_url: string;
}

export interface SpicesResponse {
    spices: Spice[];
} 