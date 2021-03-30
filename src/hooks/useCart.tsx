import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
	children: ReactNode;
}

interface UpdateProductAmount {
	productId: number;
	amount: number;
}

interface CartContextData {
	cart: Product[];
	addProduct: (productId: number) => Promise<void>;
	removeProduct: (productId: number) => void;
	updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
	const [cart, setCart] = useState<Product[]>(() => {
		const storagedCart = localStorage.getItem('@RocketShoes:cart');

		if (storagedCart) {
			return JSON.parse(storagedCart);
		}

		return [];
	});

	const addProduct = async (productId: number) => {
		try {
			// TODO
			const responseStock = await api.get<Stock>(`stock/${productId}`);
			const quantityStockProduct = responseStock.data;

			const cartExists = cart.find(product => product.id === productId);
			const currentAmountProductCart = cartExists ? cartExists.amount : 0;

			if (currentAmountProductCart >= quantityStockProduct.amount) {
				toast.error('Quantidade solicitada fora de estoque');
				return;
			}

			if (cartExists) {
				const addAmountProduct = cart.map(product => {
					if (product.id === productId) {
						product.amount += 1
					}

					return product;
				})

				localStorage.setItem(
					'@RocketShoes:cart',
					JSON.stringify(addAmountProduct)
				);

				setCart(addAmountProduct);

			} else {
				const responseProduct = await api.get(`products/${productId}`);
				const productExists = responseProduct.data;

				const productFormatted: Product = {
					...productExists,
					amount: 1
				}

				localStorage.setItem(
					'@RocketShoes:cart',
					JSON.stringify([...cart, productFormatted])
				);

				setCart(state => [...state, productFormatted])

			}
		} catch {
			// TODO
			toast.error('Erro na adição do produto');
		}
	};

	const removeProduct = (productId: number) => {
		try {
			// TODO
			const productExists = cart.find(product => product.id === productId);

			if (!productExists) {
				throw new Error;
			}

			const filteredProduct = cart.filter(product => !(product.id === productId));

			localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProduct));

			setCart(filteredProduct);
		} catch {
			// TODO
			toast.error('Erro na remoção do produto');
		}
	};

	const updateProductAmount = async ({
		productId,
		amount,
	}: UpdateProductAmount) => {
		try {
			// TODO
			if (amount <= 0) {
				return;
			}

			const response = await api.get<Stock>(`stock/${productId}`);
			const quantityStockProduct = response.data;

			if (amount > quantityStockProduct.amount) {
				toast.error('Quantidade solicitada fora de estoque');
				return
			}
			const productExists = cart.find(product => product.id === productId);

			if (!productExists) {
				throw new Error();
			}

			const updatedCart = cart.map(product => {
				if (product.id === productId) {
					product.amount = amount
				}

				return product;
			});

			localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
			setCart(updatedCart);
		} catch {
			// TODO
			toast.error('Erro na alteração de quantidade do produto');
		}
	};

	return (
		<CartContext.Provider
			value={{ cart, addProduct, removeProduct, updateProductAmount }}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart(): CartContextData {
	const context = useContext(CartContext);

	return context;
}
