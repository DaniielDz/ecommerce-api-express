import MercadoPagoConfig, { Payment, Preference } from "mercadopago";
import { ENV } from "./env";

const client = new MercadoPagoConfig({ accessToken: ENV.MP_ACCESS_TOKEN });

export const preference = new Preference(client);
export const payment = new Payment(client);
