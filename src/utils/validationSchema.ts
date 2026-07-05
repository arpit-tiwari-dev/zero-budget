import {z} from 'zod';
import i18n from '../i18n';

export const nameSchema = z
  .string()
  .refine(value => /^[A-Za-z\s]+$/.test(value), {
    message: i18n.t('validation.nameLettersOnly'),
  })
  .refine(value => value.length >= 3, {
    message: i18n.t('validation.nameMinLength'),
  })
  .refine(value => value.length <= 50, {
    message: i18n.t('validation.nameMaxLength'),
  });

export const expenseSchema = z
  .string()
  .min(1, i18n.t('validation.expenseMinLength'))
  .max(25, i18n.t('validation.expenseMaxLength'));

export const expenseDescriptionSchema = z
  .string()
  .min(0, i18n.t('validation.descriptionMinLength'))
  .max(50, i18n.t('validation.descriptionMaxLength'));

export const expenseAmountSchema = z
  .number()
  .min(0.01, i18n.t('validation.amountMin'))
  .max(1000000, i18n.t('validation.amountMax'));

export const categorySchema = z
  .string()
  .refine(value => /^[A-Za-z0-9\s]+$/.test(value), {
    message: i18n.t('validation.categoryLettersOnly'),
  })
  .refine(value => value.length >= 1, {
    message: i18n.t('validation.categoryMinLength'),
  })
  .refine(value => value.length <= 18, {
    message: i18n.t('validation.categoryMaxLength'),
  });
