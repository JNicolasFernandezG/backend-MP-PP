/**
 * DTO para la respuesta de Payment de MercadoPago
 */
export class MercadoPagoPaymentResponseDto {
  id: number;
  status: string;
  status_detail?: string;
  transaction_amount?: number;
  net_amount?: number;
  currency_id?: string;
  description?: string;
  external_reference?: string;
  preference_id?: string;
  payer?: {
    id?: number;
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
    address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: number;
    };
    phone?: {
      area_code?: string;
      number?: string;
    };
    first_name?: string;
    last_name?: string;
    entity_type?: string;
    type?: string;
  };
  date_created?: string;
  date_approved?: string;
  date_last_updated?: string;
  money_release_date?: string;
  operation_type?: string;
  issuer_id?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  receipt_number?: string;
  statement_descriptor?: string;
  card?: {
    id?: string;
    first_six_digits?: string;
    last_four_digits?: string;
    expiration_month?: number;
    expiration_year?: number;
    holder?: {
      name?: string;
      identification?: {
        number?: string;
        type?: string;
      };
    };
    issuer?: {
      id?: string;
      name?: string;
    };
    cardholder?: {
      name?: string;
      identification?: {
        number?: string;
        type?: string;
      };
    };
  };
  [key: string]: any; // Permitir propiedades adicionales
}
