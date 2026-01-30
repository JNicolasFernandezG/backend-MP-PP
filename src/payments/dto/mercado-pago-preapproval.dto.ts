/**
 * DTO para la respuesta de PreApproval (Suscripción) de MercadoPago
 */
export class MercadoPagoPreApprovalResponseDto {
  id: string;
  status: string;
  payer_email: string;
  reason?: string;
  reference_id?: string;
  auto_recurring?: {
    frequency: number;
    frequency_type: string;
    transaction_amount?: number;
    currency_id?: string;
    start_date?: string;
    end_date?: string;
    repetitions?: number;
  };
  next_payment_date?: string;
  back_url?: string;
  return_url?: string;
  setup_type?: string;
  payment_method_id?: string;
  card_token_id?: string;
  external_reference?: string;
  description?: string;
  first_invoice_offset?: number;
  date_created?: string;
  last_modified?: string;
  [key: string]: any; // Permitir propiedades adicionales
}
