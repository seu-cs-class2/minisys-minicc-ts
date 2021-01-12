.data
a:	.word 0x0
arr:	.word 15:0x0
.text
fib:			# vars = 2, regs to save($s#) = 0, outgoing args = 4, need to save return address
	addiu	$sp, $sp, -32
	sw	$ra, 28($sp)
	sw	$a0, 32($sp)
	addiu	$t0, $zero, 1
	lw	$t1, 32($sp)
	sub	$t2, $t1, $t0
	nor	$t2, $t1, $t0
_label_2_true:
	beq	$t2, $zero, _label_3_false
	nop
	addiu	$t0, $zero, 1
	move	$v0, $t0
	lw	$ra, 28($sp)
	addiu	$sp, $sp, 32
	jr	$ra
	nop
_label_3_false:
	addiu	$t0, $zero, 2
	lw	$t1, 32($sp)
	sub	$t2, $t1, $t0
	nor	$t2, $t1, $t0
_label_4_true:
	beq	$t2, $zero, _label_5_false
	nop
	addiu	$t0, $zero, 0
	move	$v0, $t0
	lw	$ra, 28($sp)
	addiu	$sp, $sp, 32
	jr	$ra
	nop
_label_5_false:
	addiu	$t0, $zero, 1
	lw	$t1, 32($sp)
	sub	$t2, $t1, $t0
	move	$a0, $t2
	jal	fib
	nop
	move	$t0, $v0
	addiu	$t1, $zero, 2
	lw	$t2, 32($sp)
	sub	$t3, $t2, $t1
	sw	$t0, 20($sp)
	move	$a0, $t3
	jal	fib
	nop
	move	$t0, $v0
	lw	$t1, 20($sp)
	add	$t2, $t1, $t0
	move	$v0, $t2
	sw	$t0, 24($sp)
	lw	$ra, 28($sp)
	addiu	$sp, $sp, 32
	jr	$ra
	nop
foo:			# vars = 0, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -0
	sw	$a0, 0($sp)
	addiu	$t0, $zero, 2
	move	$v0, $t0
	addiu	$sp, $sp, 0
	jr	$ra
	nop
main:			# vars = 5, regs to save($s#) = 0, outgoing args = 4, need to save return address
	addiu	$sp, $sp, -40
	sw	$ra, 36($sp)
	addiu	$t0, $zero, 10
	addiu	$t1, $zero, 20
	addiu	$t2, $zero, 0
	sw	$t0, 16($sp)
	sw	$t1, 20($sp)
	sw	$t2, 24($sp)
_label_10_loop:
	addiu	$t0, $zero, 15
	lw	$t1, 24($sp)
	slt	$t2, $t1, $t0
	beq	$t2, $zero, _label_11_break
	nop
	lw	$t0, 24($sp)
	move	$v1, $t0
	sll	$v1, $v1, 2
	sw	$t0, arr($v1)
	addiu	$t1, $zero, 1
	add	$t2, $t0, $t1
	sw	$t2, 24($sp)
	j	_label_10_loop
	nop
_label_11_break:
	addiu	$t0, $zero, 3
	addiu	$t1, $zero, 1
	move	$v1, $t1
	sll	$v1, $v1, 2
	lw	$t2, arr($v1)
	addiu	$t3, $zero, 2
	add	$t4, $t2, $t3
	lw	$t5, 16($sp)
	add	$t6, $t4, $t5
	lw	$t7, 20($sp)
	add	$t8, $t6, $t7
	addiu	$t9, $zero, 0x66
	lw	$s0, 0($t9)
	add	$s1, $t8, $s0
	move	$v1, $t0
	sll	$v1, $v1, 2
	sw	$s1, arr($v1)
_label_12_loop:
	lw	$t0, 16($sp)
	lw	$t1, 20($sp)
	slt	$t2, $t1, $t0
	beq	$t2, $zero, _label_13_break
	nop
	addiu	$t0, $zero, 15
	addiu	$t1, $zero, 0x00
	addiu	$t2, $zero, 1
	sw	$t2, 0($t1)
	sw	$t0, 16($sp)
_label_14_loop:
	addiu	$t0, $zero, 1
	lw	$t1, 16($sp)
	sub	$t2, $t1, $t0
	nor	$t2, $t1, $t0
	beq	$t2, $zero, _label_15_break
	nop
	addiu	$t0, $zero, 2
	lw	$t1, 20($sp)
	mult	$t1, $t0
	mflo	$t2
	sw	$t2, 20($sp)
	move	$a0, $t2
	jal	foo
	nop
	lw	$a0, 20($sp)
	jal	foo
	nop
	move	$t0, $v0
	sw	$t0, 16($sp)
	j	_label_15_break
	nop
	j	_label_14_loop
	nop
_label_15_break:
	lw	$t0, 16($sp)
	lw	$t1, 20($sp)
	slt	$t2, $t1, $t0
_label_16_true:
	beq	$t2, $zero, _label_17_false
	nop
	lw	$t0, 20($sp)
	lw	$t1, 16($sp)
	add	$t2, $t0, $t1
	sw	$t2, 20($sp)
	j	_label_12_loop
	nop
_label_17_false:
	lw	$t0, 16($sp)
	lw	$t1, 20($sp)
	slt	$t2, $t0, $t1
_label_18_true:
	beq	$t2, $zero, _label_19_false
	nop
	j	_label_13_break
	nop
_label_19_false:
	lw	$t0, 16($sp)
	lw	$t1, 20($sp)
	xor	$t2, $t0, $t1
	xor	$t3, $zero, $t2
	or	$t4, $t3, $t1
	sw	$t4, 16($sp)
	j	_label_12_loop
	nop
_label_13_break:
	addiu	$t0, $zero, 5
	move	$a0, $t0
	jal	fib
	nop
	move	$t0, $v0
	move	$v0, $t0
	sw	$t0, 28($sp)
	lw	$ra, 36($sp)
	addiu	$sp, $sp, 40
	jr	$ra
	nop